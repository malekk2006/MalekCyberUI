package com.cyberlab.api;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

import java.time.Duration;
import java.time.Instant;
import java.util.Random;

@RestController
public class TelemetryController {

    private final Random rnd = new Random();

    @GetMapping(path = "/stream/telemetry", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<Telemetry> streamTelemetry() {
        return Flux.interval(Duration.ofMillis(700))
                   .map(i -> randomTelemetry());
    }

    private Telemetry randomTelemetry() {
        long ts = Instant.now().toEpochMilli();
        double cpu = Math.max(1, 20 + rnd.nextGaussian() * 12);
        double mem = Math.max(5, 40 + rnd.nextGaussian() * 18);
        double netUp = Math.abs(Math.round((rnd.nextDouble()*6.0) * 100.0) / 100.0);
        double netDown = Math.abs(Math.round((rnd.nextDouble()*10.0) * 100.0) / 100.0);
        return new Telemetry(ts, cpu, mem, netUp, netDown);
    }
}
