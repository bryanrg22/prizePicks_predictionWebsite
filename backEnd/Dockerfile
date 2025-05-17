FROM python:3.9-slim
WORKDIR /app

# 1) Install system deps + OCaml/opam
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      ocaml ocaml-findlib m4 make opam pkg-config libffi-dev curl && \
    rm -rf /var/lib/apt/lists/*

# 2) Copy OCaml source
COPY montecarlo.ml .

# 3) Bootstrap OPAM, install ctypes & compile your .so
RUN opam init --disable-sandboxing --bare --no-setup && \
    opam switch create 4.14.0 --yes && \
    eval $(opam env --switch=4.14.0) && \
    opam update && \
    opam install --yes ctypes ctypes-foreign && \
    ocamlfind ocamlopt \
      -package ctypes.foreign \
      -linkpkg \
      -shared -o libmontecarlo.so montecarlo.ml

# 4) Python deps
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# 5) Copy rest of your app
COPY . .

CMD ["gunicorn", "app:app", \
     "--bind", "0.0.0.0:8080", \
     "--timeout", "120", \
     "--workers", "2", \
     "--capture-output", \
     "--log-level", "debug"]
