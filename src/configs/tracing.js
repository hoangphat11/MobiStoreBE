const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-grpc');
const { BatchSpanProcessor } = require('@opentelemetry/sdk-trace-base');

const jaegerExporter = new JaegerExporter({
  endpoint: 'http://localhost:14268/api/traces',
});

const otlpExporter = new OTLPTraceExporter({
  url: 'grpc://localhost:4317',
});

const sdk = new NodeSDK({
  spanProcessors: [
    new BatchSpanProcessor(jaegerExporter),
    new BatchSpanProcessor(otlpExporter),
  ],
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
console.log('Tracing initialized to both Jaeger and SigNoz');