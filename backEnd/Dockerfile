FROM python:3.9-slim
WORKDIR /app

# 1) Install OCaml & Ctypes toolchain
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      ocaml ocaml-findlib m4 make \
      libctypes-foreign-ocaml-dev && \
    rm -rf /var/lib/apt/lists/*


# 2) Python deps
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install -r requirements.txt && \
    pip install openai firebase-admin pdfplumber


# 3) Copy OCaml source & compile shared lib
COPY montecarlo.ml .
RUN ocamlfind ocamlopt \
      -package ctypes.foreign -linkpkg \
      -shared -o libmontecarlo.so montecarlo.ml


# 4) Copy the rest of your code
COPY . .


# 5) Launch
CMD exec gunicorn app:app \
     --bind 0.0.0.0:8080 \
     --timeout 120 \
     --workers 2 \
     --capture-output \
     --log-level debug