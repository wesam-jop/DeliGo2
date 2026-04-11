<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('advertisements', function (Blueprint $table) {
            $table->id();
            $table->string('type')->comment('text, media');
            $table->string('placement')->comment('banner, sidebar, footer');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('media_url')->nullable()->comment('Image or video URL');
            $table->string('media_type')->nullable()->comment('image, video');
            $table->string('link_url')->nullable()->comment('Redirect link');
            $table->date('start_date');
            $table->date('end_date');
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index(['placement', 'is_active', 'start_date', 'end_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('advertisements');
    }
};
