// src/middleware/tracingMiddleware.js
import { trace, context, SpanStatusCode } from '@opentelemetry/api';
import logger from '../configs/logger.js';

export const tracingMiddleware = (req, res, next) => {
    const tracer = trace.getTracer('api-tracer');

    // Tạo span cho request
    const span = tracer.startSpan(`${req.method} ${req.originalUrl}`);

    // Khi response kết thúc
    res.on('finish', () => {
        const duration = Date.now() - req.startTime;
        const userId = req.user?._id || 'guest';

        // Ghi log vào Winston
        logger.info(
            `[TRACE] ${req.method} ${req.originalUrl} - Status: ${res.statusCode} - Duration: ${duration}ms - User: ${userId}`
        );

        // Thêm attributes cho span
        span.setAttributes({
            'http.method': req.method,
            'http.url': req.originalUrl,
            'http.status_code': res.statusCode,
            'user.id': userId,
        });

        // Nếu status >= 400 đánh dấu lỗi
        if (res.statusCode >= 400) {
            span.setStatus({ code: SpanStatusCode.ERROR });
        } else {
            span.setStatus({ code: SpanStatusCode.OK });
        }

        // Kết thúc span
        span.end();
    });

    // Lưu thời gian bắt đầu request
    req.startTime = Date.now();

    next();
};
