<?php

declare(strict_types=1);

namespace Tests\Feature;

use Tests\TestCase;

final class HealthCheckTest extends TestCase
{
    public function test_health_endpoint_is_up(): void
    {
        $this->get('/up')->assertStatus(200);
    }
}
