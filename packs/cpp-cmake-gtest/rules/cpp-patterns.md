---
paths:
  - "**/*.cpp"
  - "**/*.cc"
  - "**/*.cxx"
  - "**/*.h"
  - "**/*.hpp"
  - "**/*.hh"
---
# C++ patterns (pack cpp-cmake-gtest)

> Adapted from ECC `rules/common/patterns.md` and `rules/cpp/patterns.md` (MIT).
> `project/rules.md` wins where it differs.

## Ports and adapters at the library edge

A library never depends on the host's logging, settings, UI or device code: a pure virtual
interface plus a neutral DTO, injected by non-owning pointer or reference, `nullptr` meaning
"feature off". The composition root is the host, never the library.

## Config as value types

Configs are default-constructible, copyable value types: copy, modify, set. A polymorphic
algorithm block (`std::shared_ptr<IAlgorithmConfig>`, concrete classes `final` and cloneable)
keeps "add an algorithm = add an enum value, a config subclass and a factory branch"; write
that recipe in the header comment.

## Results, not exceptions

`std::optional<T>` for "may not exist"; a result struct (`ok`, `error`) for mutations; return
by value and let RVO work; prefer one returned struct to several out-parameters.

## RAII owner for raw or aligned memory

```cpp
template <typename T> class AlignedBuffer {
public:
    explicit AlignedBuffer(size_t n = 0, size_t align = 32);
    AlignedBuffer(AlignedBuffer&&) noexcept;
    AlignedBuffer& operator=(AlignedBuffer&&) noexcept;
    AlignedBuffer(const AlignedBuffer&);            // deep copy, or = delete: decide
    AlignedBuffer& operator=(const AlignedBuffer&);
    ~AlignedBuffer();
    T* data() noexcept; size_t size() const noexcept;
};
```

Exactly one type owns the allocation call; nothing else calls it.

## Rule of Zero / Five

Rule of Zero by default: members that are containers, smart pointers or ref-counted handles
need no special members. If you define any of destructor, copy or move, define all five and
mark moves `noexcept`.

## Value semantics

Small trivially-copyable types by value; containers, images and configs by `const&`; `[[nodiscard]]`
on accessors whose result must not be ignored; `const` everywhere it is true.

## Staged algorithms

Keep a multi-stage computation as named stages (`coarse -> refine -> filter`) so each can be
unit-tested alone and timed alone.

## Views and lifetimes

A view into another object's memory (`mat(rect)`, `string_view`, span) never outlives its
owner; document the lifetime where a view is stored. Clamp regions against the parent bounds
with the library's own intersection helpers, not hand-written min/max.

## Angles and units

Degrees at the public API, radians only inside kernels; one wrap convention, written down in
`project/rules.md`, used everywhere, and compared in tests by wrapped difference.
