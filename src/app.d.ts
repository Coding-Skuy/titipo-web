declare global {
  namespace App {
    interface Locals {
      /** Token Bearer admin dari cookie sesi (JWT Lumbung, aud=titipo). */
      token: string | null;
    }
  }
}

export {};
