import type { UserRole } from "../models/user.model";

declare global {
    namespace Express {
        interface Request {
            user?: { id: string; role: UserRole };
        }
    }
}

export { };