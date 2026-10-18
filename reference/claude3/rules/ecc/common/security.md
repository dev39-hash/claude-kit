# Security Guidelines

> Adapted from ECC (`affaan-m/ecc`, MIT). The original is web-centric (SQL/XSS/CSRF); this
> version keeps what applies to a native library.

## Mandatory checks before any commit

- [ ] No secrets, license keys, or absolute user paths committed (`C:\Users\...`)
- [ ] All external inputs validated at the boundary: image size/type, ROI bounds, config
      ranges, JSON schema version
- [ ] No unbounded allocation driven by file content (image dimensions, point counts)
- [ ] File paths from configs/JSON are not used to write outside an intended directory
- [ ] No `system()`, `popen()`, or shell-outs in library code
- [ ] Error messages do not leak internal paths to end users of the host app

## Untrusted data

Treat pattern JSON documents, image files, and anything read from disk as untrusted:
reject on unknown `version`, clamp sizes, and fail with a `ManagerResult`, never UB.

## Security Response Protocol

If a security issue is found: stop, fix CRITICAL issues before continuing, search the
codebase for the same pattern, and record the decision in an ADR if the API changes.
