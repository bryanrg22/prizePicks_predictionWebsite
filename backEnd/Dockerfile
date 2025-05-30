#######################  Stage 1 – build the shared library  ###################
FROM ocaml/opam:debian-12-ocaml-4.14 AS builder

# ── system deps ───────────────────────────────────────────────────────────────
USER root
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential libffi-dev pkg-config && \
    rm -rf /var/lib/apt/lists/*

# ── Prepare build environment ─────────────────────────────────────────────────
RUN mkdir -p /app && chown opam:opam /app
USER opam
WORKDIR /app

# ── Copy only required build files ────────────────────────────────────────────
COPY --chown=opam:opam montecarlo.ml mc_stub.c ./

# ── OCaml deps ────────────────────────────────────────────────────────────────
RUN opam update && \
    opam install -y ocamlfind ctypes.0.15.0

# ── Fix permissions ────────────────────────────────────────────────────────────
RUN sudo chown -R opam:opam .

# ── build steps ───────────────────────────────────────────────────────────────
# 1) compile OCaml -> position‑independent object file
RUN opam exec -- \
    ocamlfind ocamlopt -thread -runtime-variant _pic \
      -package ctypes -linkpkg \
      -output-obj -o montecarlo_combined.o montecarlo.ml

# 2) compile the C shim
RUN opam exec -- sh -c "eval \$(opam env) && gcc -fPIC -I \$(ocamlc -where) -c mc_stub.c -o mc_stub.o"

# 3) link both into a real .so
RUN gcc -shared -o libmontecarlo.so mc_stub.o montecarlo_combined.o \
      -lm -ldl -lpthread

########################  Stage 2 – slim runtime image  ########################
FROM python:3.9-slim
WORKDIR /app

# ── System dependencies ───────────────────────────────────────────────────────
RUN apt-get update && \
    apt-get install -y --no-install-recommends libffi-dev && \
    rm -rf /var/lib/apt/lists/*

# ── Bring in compiled library ─────────────────────────────────────────────────
COPY --from=builder /app/libmontecarlo.so .

# ── Python dependencies ───────────────────────────────────────────────────────
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ── Application code ──────────────────────────────────────────────────────────
# Copy only necessary Python files
COPY app.py player_analyzer.py prediction_analyzer.py screenshot_parser.py \
     volatility.py chatgpt_bet_explainer.py monte_carlo.py injury_report.py ./

# ── Run Gunicorn ──────────────────────────────────────────────────────────────
CMD gunicorn app:app \
     --bind 0.0.0.0:${PORT:-8080} \
     --timeout 120 \
     --workers 2 \
     --capture-output \
     --log-level debug