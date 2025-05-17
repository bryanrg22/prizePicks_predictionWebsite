# Stage 1: build the OCaml shared lib with OPAM
FROM ocaml/opam:debian-12-ocaml-4.14 AS builder

# 1) as root, install pkg-config, libffi-dev (for ctypes) and ocaml-findlib (gives you ocamlfind)
USER root
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      pkg-config \
      libffi-dev \
      ocaml-findlib && \
    rm -rf /var/lib/apt/lists/*

# 2) back to the opam user for opam commands
USER opam
WORKDIR /app

COPY montecarlo.ml .

# 3) install only ctypes + ctypes-foreign, then build
RUN opam update && \
    opam install --yes ctypes ctypes-foreign && \
    eval $(opam env) && \
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
