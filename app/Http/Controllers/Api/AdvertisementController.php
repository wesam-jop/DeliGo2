<?php

namespace App\Http\Controllers\Api;

use App\Models\Advertisement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AdvertisementController extends ApiController
{
    /**
     * Get all advertisements (Admin)
     */
    public function index(): JsonResponse
    {
        $ads = Advertisement::orderBy('sort_order')->orderByDesc('created_at')->get();

        return $this->success($ads);
    }

    /**
     * Get active advertisements by placement (Public)
     */
    public function getActiveAds(string $placement): JsonResponse
    {
        $ads = Advertisement::active()
            ->running()
            ->placement($placement)
            ->orderBy('sort_order')
            ->get()
            ->map(function ($ad) {
                return [
                    'id' => $ad->id,
                    'type' => $ad->type,
                    'title' => $ad->title,
                    'description' => $ad->description,
                    'media_url' => $ad->media_url_full,
                    'media_type' => $ad->media_type,
                    'link_url' => $ad->link_url,
                ];
            });

        return $this->success($ads);
    }

    /**
     * Store a new advertisement
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'string', 'in:text,media'],
            'placement' => ['required', 'string', 'in:banner,sidebar,footer'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'media_file' => ['nullable', 'file', 'mimes:jpg,jpeg,png,gif,mp4,webm,mov', 'max:51200'],
            'media_url' => ['nullable', 'string', 'max:500'],
            'media_type' => ['nullable', 'string', 'in:image,video'],
            'link_url' => ['nullable', 'string', 'max:500'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'is_active' => ['sometimes', 'in:0,1,true,false'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);

        // Normalize is_active (FormData sends "1"/"0")
        if (isset($validated['is_active'])) {
            $validated['is_active'] = in_array($validated['is_active'], [1, '1', 'true', true], true);
        }

        // Handle file upload
        if ($request->hasFile('media_file')) {
            $file = $request->file('media_file');
            $path = $file->store('ads', 'public');
            $validated['media_url'] = url('storage/' . $path);

            // Auto-detect media type
            $mimeType = $file->getMimeType();
            $validated['media_type'] = str_starts_with($mimeType, 'video') ? 'video' : 'image';
        }

        $ad = Advertisement::create($validated);

        return $this->success(['advertisement' => $ad], 'تم إنشاء الإعلان بنجاح', 201);
    }

    /**
     * Update an advertisement
     */
    public function update(Request $request, Advertisement $advertisement): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['sometimes', 'string', 'in:text,media'],
            'placement' => ['sometimes', 'string', 'in:banner,sidebar,footer'],
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'media_file' => ['nullable', 'file', 'mimes:jpg,jpeg,png,gif,mp4,webm,mov', 'max:51200'],
            'media_url' => ['nullable', 'string', 'max:500'],
            'media_type' => ['nullable', 'string', 'in:image,video'],
            'link_url' => ['nullable', 'string', 'max:500'],
            'start_date' => ['sometimes', 'date'],
            'end_date' => ['sometimes', 'date', 'after_or_equal:start_date'],
            'is_active' => ['sometimes', 'in:0,1,true,false'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);

        // Normalize is_active (FormData sends "1"/"0")
        if (isset($validated['is_active'])) {
            $validated['is_active'] = in_array($validated['is_active'], [1, '1', 'true', true], true);
        }

        // Handle file upload
        if ($request->hasFile('media_file')) {
            // Delete old file if it exists
            if ($advertisement->media_url && !str_starts_with($advertisement->media_url, 'http')) {
                Storage::disk('public')->delete($advertisement->media_url);
            }

            $file = $request->file('media_file');
            $path = $file->store('ads', 'public');
            $validated['media_url'] = url('storage/' . $path);

            // Auto-detect media type
            $mimeType = $file->getMimeType();
            $validated['media_type'] = str_starts_with($mimeType, 'video') ? 'video' : 'image';
        }

        $advertisement->update($validated);

        return $this->success(['advertisement' => $advertisement->fresh()], 'تم تحديث الإعلان بنجاح');
    }

    /**
     * Delete an advertisement
     */
    public function destroy(Advertisement $advertisement): JsonResponse
    {
        // Delete associated file if stored locally
        if ($advertisement->media_url && !str_starts_with($advertisement->media_url, 'http')) {
            Storage::disk('public')->delete($advertisement->media_url);
        }

        $advertisement->delete();

        return $this->success(null, 'تم حذف الإعلان بنجاح');
    }
}
