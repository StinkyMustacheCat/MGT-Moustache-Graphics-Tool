# Media input integration fixtures

These short, synthetic files are generated test signals (sine tones, color bars/test patterns, silence, and deliberately malformed input). They contain no user or third-party media. They exercise import and validation for MP3, FLAC, AAC/M4A, Vorbis, Opus, H.264, HEVC, ProRes, VP8, VP9, and AV1, plus duration, frame-rate, and multi-audio rejection.

The fixtures are checked in so the test suite does not require optional encoders such as `libmp3lame`, `libx265`, or `libaom-av1` in the MGT runtime being tested. They are not product examples or runtime assets. The test reads them directly and never regenerates them with the candidate FFmpeg build.
