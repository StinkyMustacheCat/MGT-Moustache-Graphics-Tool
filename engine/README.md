# MGT Engine 1.6.4

This directory contains the standalone engine source. `motor/` includes the local server and the rendering source shared with the editor; no Node, Chromium, Playwright, or FFmpeg runtime binaries are committed here.

The engine exposes local asset contracts v1 and v2 for MGT JSON and project files. See [the API overview](docs/README.md), [contract v1](docs/MGT-ASSET-CONTRACT.md), and [contract v2](docs/MGT-ASSET-CONTRACT-v2.md). Example requests and responses are in `motor/examples/asset-v2/`.

The downloadable Engine ZIP includes its bundled runtimes and notices. The engine is an API, not a plugin: no adapters for DaVinci Resolve, Adobe Premiere Pro, Vegas Pro, or other NLEs are included or declared supported.
