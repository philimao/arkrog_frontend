import { _post, hashPassword } from "~/utils/tools";
import type { User } from "~/types/user";

async function login(
  username: string,
  password: string,
): Promise<User | undefined> {
  try {
    return await _post("/user/login", {
      username,
      hash: await hashPassword(password),
    });
  } catch (err) {}
}

export { login };
