# Common Patterns

> Adapted from ECC (`affaan-m/ecc`, MIT). Web patterns (repository/API envelope) replaced
> with the patterns this library already uses.

## Ports & Adapters at the library edge

The matcher never depends on robot, logging, or settings libraries directly:

- `IRobotPickingChecker` (reference) is the model: a pure virtual interface, a neutral DTO
  (`WorldPickPose`), injected via a non-owning pointer, `nullptr` = feature off.
- Apply the same shape to logging (`ILogger`) and any persistence (`IPatternStore`).
- Composition root is the host app, never the library.

## Config as value types with a polymorphic algorithm block

- `MatchGroupConfig` owns `std::shared_ptr<IMatchTypeConfig>`; concrete configs
  (`EdgeMatchConfig`) are `final`, cloneable, default-constructible.
- Adding an algorithm = add enum value, add config subclass, add `createDefault()` branch.
  Keep that recipe in the header comment.

## Result objects, not exceptions

- `ManagerResult { bool ok; std::wstring error; }` for mutations; `MatchResult` for a run.
- Prefer returning a struct over multiple out-params (Core Guidelines F.21).

## RAII owners for aligned buffers

```cpp
template <typename T> class AlignedBuffer {   // owns _mm_malloc / _mm_free
public:
    explicit AlignedBuffer(size_t n = 0, size_t align = 32);
    AlignedBuffer(AlignedBuffer&&) noexcept;
    AlignedBuffer& operator=(AlignedBuffer&&) noexcept;
    AlignedBuffer(const AlignedBuffer&);          // deep copy
    AlignedBuffer& operator=(const AlignedBuffer&);
    ~AlignedBuffer();
    T* data() noexcept; size_t size() const noexcept;
};
```

`PatternLayer` in the reference hand-rolls this with three raw pointers; port it onto one
owner type so the Rule of Five lives in exactly one place.

## Coarse-to-fine search skeleton

Keep the pyramid search as three named stages so each can be tested alone:

1. `coarseSearch(topLayer) -> candidates`
2. `refine(candidates, layer-1 ... 0) -> candidates`
3. `filter(candidates: score, overlap) -> matches`
