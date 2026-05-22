"""Logging setup. One logger, file + stream."""
import logging
import sys
from logging.handlers import RotatingFileHandler

from app.core.config import get_settings

_configured = False


def get_logger(name: str = "jarvy") -> logging.Logger:
    global _configured
    settings = get_settings()
    logger = logging.getLogger(name)

    if not _configured:
        logger.setLevel(logging.INFO)
        fmt = logging.Formatter(
            "%(asctime)s | %(levelname)-7s | %(name)s | %(message)s"
        )

        stream = logging.StreamHandler(sys.stdout)
        stream.setFormatter(fmt)
        logger.addHandler(stream)

        file_handler = RotatingFileHandler(
            settings.log_path, maxBytes=2_000_000, backupCount=3
        )
        file_handler.setFormatter(fmt)
        logger.addHandler(file_handler)

        logger.propagate = False
        _configured = True

    return logger
