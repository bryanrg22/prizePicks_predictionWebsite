#include <caml/mlvalues.h>
#include <caml/callback.h>
#include <math.h>

// Initializes the OCaml runtime once per process
static void ensure_ocaml_runtime(void) {
  static int initialized = 0;
  if (!initialized) { char *argv[1] = { NULL }; caml_startup(argv); initialized = 1; }
}

double monte_carlo(double mu, double sigma, double threshold, unsigned long sims) {
  ensure_ocaml_runtime();
  static const value *fn = NULL;
  if (!fn) fn = caml_named_value("ocaml_monte_carlo");
  
  value args[4] = { caml_copy_double(mu),
                    caml_copy_double(sigma),
                    caml_copy_double(threshold),
                    Val_long(sims) };
  
  value res = caml_callbackN(*fn, 4, args);
  return Double_val(res);
}