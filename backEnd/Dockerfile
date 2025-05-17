### Stage 1: build the OCaml shared library
FROM ocaml/opam:debian-12-ocaml-4.14 AS builder

USER root
# remove ocaml-findlib, keep only what the C bindings need
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        pkg-config libffi-dev && \
    rm -rf /var/lib/apt/lists/*

USER opam
WORKDIR /app
COPY montecarlo.ml .

# install everything _inside_ the switch and compile
RUN opam update && \
    opam install -y ctypes ctypes-foreign   # brings its own findlib

RUN opam exec -- \
         ocamlfind ocamlopt \
           -package ctypes,ctypes.foreign \
           -linkpkg \
           -shared -o libmontecarlo.so montecarlo.ml

# Stage 2: runtime Python image
FROM python:3.9-slim
WORKDIR /app

# for using the .so
RUN apt-get update && \
    apt-get install -y --no-install-recommends libffi-dev && \
    rm -rf /var/lib/apt/lists/*

# pull in your compiled .so
COPY --from=builder /app/libmontecarlo.so .

# Python deps
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# your app sources
COPY . .

CMD ["gunicorn", "app:app", \
     "--bind", "0.0.0.0:8080", \
     "--timeout", "120", \
     "--workers", "2", \
     "--capture-output", \
     "--log-level", "debug"]
