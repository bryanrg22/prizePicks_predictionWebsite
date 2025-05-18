open Ctypes
open Foreign

(* Box–Muller transform for normal draws *)
let gaussian mu sigma =
  let u1 = Random.float 1.0 in
  let u2 = Random.float 1.0 in
  let z0 = sqrt (-2. *. log u1) *. cos (2. *. Float.pi *. u2) in
  mu +. sigma *. z0

let monte_carlo mu sigma threshold sims =
  let rec loop i count =
    if i = 0 then float_of_int count /. float_of_int sims
    else
      let draw = gaussian mu sigma in
      loop (i - 1) (count + if draw > threshold then 1 else 0)
  in
  loop sims 0

(* Expose as a C function *)
let () =
  foreign_value "monte_carlo"
    (double @-> double @-> double @-> ulong @-> returning double)
    monte_carlo
