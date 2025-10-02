package com.cyberlab.api;

public record Telemetry(long ts, double cpu, double mem, double netUp, double netDown) {}
