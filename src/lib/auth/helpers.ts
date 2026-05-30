import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET environment variable is required");

export const hashPassword = async (pass: string) => bcrypt.hash(pass, 12);
export const verifyPassword = async (pass: string, hashed: string) => bcrypt.compare(pass, hashed);

export const generateToken = (payload: object) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

export const verifyToken = (token: string): { userId: string } | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
};

export const getUserByEmail = async (email: string) => {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      password: true,
    },
  });
};

export const getUserById = async (id: string) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      credits: {
        select: {
          balance: true,
          totalGranted: true,
          totalSpent: true,
        },
      },
    },
  });
};

export const createUser = async (name: string, password: string, email: string) => {
  const hashedPassword = await hashPassword(password);

  return prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      credits: {
        create: {
          balance: 50,
          totalGranted: 50,
          transactions: {
            create: {
              amount: 50,
              type: "GRANT",
              reason: "initial_account_allocation",
            },
          },
        },
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });
};
