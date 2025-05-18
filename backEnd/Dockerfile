#######################  Stage 1 – build the shared library  ###################
FROM ocaml/opam:debian-12-ocaml-4.14 AS builder

# ── system deps ───────────────────────────────────────────────────────────────
USER root
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential libffi-dev pkg-config && \
    rm -rf /var/lib/apt/lists/*

# ── OCaml deps ────────────────────────────────────────────────────────────────
USER opam
WORKDIR /app

# copy sources: OCaml + C stub
COPY montecarlo.ml mc_stub.c ./

RUN opam update && \
    opam install -y ocamlfind ctypes.0.15.0

# ── build steps ───────────────────────────────────────────────────────────────
# 1) compile OCaml -> position‑independent object file (renamed output)
RUN opam exec -- \
    ocamlfind ocamlopt -thread -runtime-variant _pic \
      -package ctypes -linkpkg \
      -output-obj -o montecarlo_combined.o montecarlo.ml

# 2) compile the C shim with verified OCaml header path
RUN opam exec -- sh -c "eval \$(opam env) && gcc -fPIC -I \$(ocamlc -where) -c mc_stub.c -o mc_stub.o"


# 3) link both into a real .so
RUN gcc -shared -o libmontecarlo.so mc_stub.o montecarlo_combined.o \
      -lm -ldl -lpthread

########################  Stage 2 – slim runtime image  ########################
FROM python:3.9-slim
WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends libffi-dev && \
    rm -rf /var/lib/apt/lists/*

# bring in the compiled shared object
COPY --from=builder /app/libmontecarlo.so .

# Python deps
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# your backend source (the whole build context)
COPY . .

CMD gunicorn app:app \
     --bind 0.0.0.0:8080 \
     --timeout 120 \
     --workers 2 \
     --capture-output \
     --log-level debug