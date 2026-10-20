MGT FFmpeg build — MGT 1.5.2
===========================

The Windows x64 portable package uses a project-specific static FFmpeg build,
not the former Gyan Essentials binary. FFmpeg is version 9.0.1 from upstream
commit bf1b838f2ab88b4f8fd83443325c782ea0e0f7fa. Its external libraries are
libx264, version 0.165.3223 from commit 0480cb05fa188d37ae87e8f4fd8f1aea3711f7ee,
dav1d 1.5.4 from commit 54706fc6bc0cdecab7e9593974a4039cc038fca7, and zlib 1.3.2
from commit da607da739fa6047df13e66a2af6b8bec7c2a498. dav1d provides software
AV1 decoding on Windows; zlib provides the PNG decoder/encoder used by MGT's
frame pipeline. The FFmpeg configuration enables GPL, version 3, libx264,
libdav1d, and zlib; it builds static executables and disables autodetection,
shared libraries, documentation, ffplay, and debug output. FFmpeg's built-in
codecs, filters, AAC encoder, H.264 decoder, PNG support, and ffprobe remain
available as needed by MGT.

Corresponding source is distributed in this repository:
  third-party/ffmpeg/sources/ffmpeg-9.0.1-bf1b838f2a.tar.xz
  third-party/ffmpeg/sources/x264-0.165.3223-0480cb0.tar.xz
  third-party/ffmpeg/sources/zlib-1.3.2-da607da739.tar.gz
  third-party/ffmpeg/sources/dav1d-1.5.4.tar.gz
SHA-256 checksums are in third-party/ffmpeg/sources/SHA256SUMS. The archives
are source snapshots pinned to exact commits and verified before compilation.
The build recipe is third-party/ffmpeg/build.sh. It expects MSYS2 UCRT64,
MinGW-w64 GCC, GNU Make, Meson, Ninja, pkg-config, NASM, tar, and the x86_64
cross-toolchain. The tested toolchain was MSYS2 UCRT64, GCC 16.2.0 Rev5, GNU
Make 4.4.1, and NASM 3.02. The FFmpeg prefix and dependency flags are
path-neutral so the builder's workspace path is not embedded in the displayed
build configuration. See docs/BUILD.md.

FFmpeg is licensed under LGPL-2.1-or-later or GPL-2.0-or-later, depending on
configuration. This build enables GPL components and version 3, so the
resulting FFmpeg program is distributed under GPL-3.0-or-later. x264 is
GPL-2.0-or-later; the combined executable's applicable terms are GPL-3.0-or-later.
dav1d retains its BSD 2-Clause license, and its patent notice is included for
redistribution context. zlib retains its own license. The full license texts
are provided in licenses/FFmpeg-LICENSE, licenses/x264-LICENSE.txt,
licenses/dav1d-COPYING.txt, and licenses/zlib-LICENSE.txt; dav1d's notice is
in licenses/dav1d-PATENTS.txt. This file describes this exact MGT build; it is
not a statement about every FFmpeg build.

Upstream references:
  https://github.com/FFmpeg/FFmpeg/commit/bf1b838f2ab88b4f8fd83443325c782ea0e0f7fa
  https://code.videolan.org/videolan/x264/-/commit/0480cb05fa188d37ae87e8f4fd8f1aea3711f7ee
  https://github.com/videolan/dav1d/commit/54706fc6bc0cdecab7e9593974a4039cc038fca7
  https://github.com/madler/zlib/commit/da607da739fa6047df13e66a2af6b8bec7c2a498
