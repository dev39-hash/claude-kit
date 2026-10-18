---
paths:
  - "**/*.cpp"
  - "**/*.hpp"
  - "**/*.cc"
  - "**/*.hh"
  - "**/*.cxx"
  - "**/*.h"
---
# C++ Patterns

> From ECC (`affaan-m/ecc`, MIT), extends [common/patterns.md](../common/patterns.md).

## RAII

Tie resource lifetime to object lifetime. Example owner for aligned memory:

```cpp
class AlignedFloats {
public:
    explicit AlignedFloats(size_t n) : m_size(n), m_data(static_cast<float*>(_mm_malloc(n * sizeof(float), 32))) {}
    ~AlignedFloats() { _mm_free(m_data); }
    AlignedFloats(const AlignedFloats&) = delete;             // or deep-copy, but decide
    AlignedFloats& operator=(const AlignedFloats&) = delete;
    AlignedFloats(AlignedFloats&& o) noexcept : m_size(o.m_size), m_data(std::exchange(o.m_data, nullptr)) {}
    AlignedFloats& operator=(AlignedFloats&& o) noexcept;
private:
    size_t m_size{0};
    float* m_data{nullptr};
};
```

## Rule of Five / Zero

- **Rule of Zero** by default: classes made of `cv::Mat`, `std::vector`, smart pointers need no
  special members (`MatchPatternConfig` only needs a custom copy because it deep-clones a Mat)
- **Rule of Five**: if you define any of destructor / copy / move, define all five and mark
  moves `noexcept`

## Value Semantics

- Small trivially-copyable types (`cv::Point2f`, `cv::Size`, enums) by value
- `cv::Mat`, configs, vectors by `const&`
- Return by value (RVO); `std::move` into sinks
- Mark accessors `const` and `[[nodiscard]]` where ignoring the result is a bug

## Error Handling

- `std::optional<T>` for "may not exist" (e.g. `findPatternByName`)
- Result structs (`ManagerResult`) for expected failures with a message
- Exceptions only for exceptional conditions; `noexcept` on moves, destructors, swaps
- `CV_Assert` for contract violations in debug-sensitive kernels

## OpenCV idioms

- `cv::Mat` ROI views (`img(rect)`) share memory: never store a view beyond the parent's life
- Use `cv::Rect & cv::Rect(0,0,cols,rows)` to clamp ROIs instead of manual min/max
- `cv::RotatedRect::points()` into a `std::array<cv::Point2f,4>` or `std::vector` sized 4
- Angles: keep degrees in public API, radians only inside kernels; wrap to (-180, 180]

## Reference

See skill `cpp-coding-standards` for patterns and anti-patterns.
