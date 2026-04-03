<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    /**
     * UltraMsg config
     */
    protected string $instanceId;
    protected string $token;
    protected string $baseUrl;

    public function __construct()
    {
        $this->instanceId = env('ULTRAMSG_INSTANCE_ID', '');
        $this->token = env('ULTRAMSG_TOKEN', '');
        $this->baseUrl = "https://api.ultramsg.com/{$this->instanceId}/messages/chat";
    }

    /**
     * Send a WhatsApp message
     *
     * @param string $to Phone number with country code (e.g. +963XXXXXXXXX)
     * @param string $body Message body
     * @return array
     */
    public function sendMessage(string $to, string $body): array
    {
        if (empty($this->instanceId) || empty($this->token)) {
            Log::error('UltraMsg Configuration Missing');
            return [
                'success' => false,
                'message' => 'Configuration missing. Set ULTRAMSG_INSTANCE_ID and ULTRAMSG_TOKEN in .env'
            ];
        }

        try {
            // Normalize phone number (UltraMsg expects it with country code, no + or spaces)
            $toClean = str_replace(['+', ' ', '-'], '', $to);

            $response = Http::post($this->baseUrl, [
                'token' => $this->token,
                'to' => $toClean,
                'body' => $body,
                'priority' => 10,
            ]);

            if ($response->successful()) {
                Log::info('WhatsApp message sent to: ' . $to);
                return [
                    'success' => true,
                    'data' => $response->json()
                ];
            }

            Log::error('UltraMsg API error', ['response' => $response->body()]);
            return [
                'success' => false,
                'message' => 'API Error: ' . ($response->json()['message'] ?? 'Unknown error')
            ];

        } catch (\Exception $e) {
            Log::error('WhatsApp message failed', ['exception' => $e->getMessage()]);
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
}
