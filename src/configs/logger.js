import { createLogger, transports, format } from "winston";

const logger = createLogger({
    format: format.combine(
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        format.printf(info => `${info.timestamp} [${info.level.toUpperCase()}] ${info.message}`)
    ),
    transports: [
        new transports.Console(),
        new transports.File({ filename: "logs/app.log" })
    ]
});

export default logger;
