FROM python:3.9-slim
WORKDIR /app

# 1) Install system deps + OCaml/opam
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      ocaml ocaml-findlib m4 make opam pkg-config libffi-dev curl && \
    rm -rf /var/lib/apt/lists/* && \
# 2) Bootstrap OPAM, switch, install ctypes packages
    opam init --disable-sandboxing --bare --no-setup && \
    opam switch create 4.14.0 --yes && \
    eval $(opam env --switch=4.14.0) && \
    opam update && \
    opam install --yes ctypes ctypes-foreign && \
# 3) Copy & compile your .ml into a shared lib
    cp montecarlo.ml /app/ && \
    ocamlfind ocamlopt \
      -package ctypes.foreign \
      -linkpkg \
      -shared -o libmontecarlo.so montecarlo.ml

# 4) Python deps
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# 5) Copy rest of your code
COPY . .

CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:8080", "--timeout", "120", "--workers", "2", "--capture-output", "--log-level", "debug"]
