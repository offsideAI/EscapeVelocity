//! Compilation pipeline: write `build/main.tex`, run the embedded Tectonic
//! engine with SyncTeX enabled, and return the PDF path, SyncTeX data, and
//! parsed plain-language diagnostics. Recompiles are debounced and cancellable.
//! Implemented in M1.
