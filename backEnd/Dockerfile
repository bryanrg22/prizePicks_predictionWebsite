### Stage 1 ─ build the shared library
FROM ocaml/opam:debian-12-ocaml-4.14 AS builder

USER root
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        libffi-dev pkg-config && \
    rm -rf /var/lib/apt/lists/*

USER opam
WORKDIR /app
COPY montecarlo.ml .

# install everything the build needs _inside the switch_
RUN opam update && \
    opam install -y ocamlfind ctypes ctypes-foreign

# compile the .so with the switch‑local ocamlfind/ocamlopt
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
