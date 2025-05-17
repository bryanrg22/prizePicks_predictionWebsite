# backEnd/Dockerfile
FROM python:3.9-slim
WORKDIR /app

# 1) Install OCaml, OPAM & build tools
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      ocaml ocaml-findlib m4 make opam pkg-config libffi-dev curl && \
    rm -rf /var/lib/apt/lists/*

# 2) Bootstrap OPAM, create a switch, install ctypes & ctypes-foreign
RUN opam init --disable-sandboxing --bare --no-setup && \
    opam switch create 4.14.0 --yes && \
    eval $(opam env) && \
    opam update && \
    opam install --yes ctypes ctypes-foreign

# 3) Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install -r requirements.txt && \
    pip install openai firebase-admin pdfplumber

# 4) Copy OCaml source & compile shared lib within OPAM env
COPY montecarlo.ml .
RUN . /root/.opam/opam-init/init.sh && \
    ocamlfind ocamlopt \
      -package ctypes.foreign -linkpkg \
      -shared -o libmontecarlo.so montecarlo.ml

# 5) Copy the rest of your app
COPY . .

# 6) Start the server
CMD ["gunicorn", "app:app", \
     "--bind", "0.0.0.0:8080", \
     "--timeout", "120", \
     "--workers", "2", \
     "--capture-output", \
     "--log-level", "debug"]
