import { useAuth } from "@/providers/auth-provider";
import { ChangeEvent, FormEvent, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FaGoogle, FaGithub } from "react-icons/fa";

export const LoginContent = () => {
    const { login, isLoading } = useAuth();

    const [data, setData] = useState({
        email: "",
        password: "",
    });

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setData({ ...data, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        await login(data.email, data.password);
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
                <Label>Email address</Label>
                <Input
                    onChange={handleChange}
                    value={data.email}
                    name="email"
                    placeholder="Enter your email address"
                />
            </div>

            <div className="flex flex-col">
                <Label className="flex justify-between">
                    <span>Password</span>
                    <Button variant="link" className="p-0 w-fit text-xs">
                        Forgot password?
                    </Button>
                </Label>
                <Input
                    name="password"
                    onChange={handleChange}
                    value={data.password}
                    type="password"
                    placeholder="Enter your password"
                />
            </div>

            <Button disabled={isLoading} type="submit">
                LOG IN
            </Button>

            <div className="flex w-full items-center text-xs">
                <div className="flex-grow border-t border-divider-1"></div>
                <span className="px-3 text-gray-400">OR</span>
                <div className="flex-grow border-t border-divider-1"></div>
            </div>

            <div className="flex flex-col gap-2">
                <Button variant="outline">
                    {" "}
                    <FaGoogle /> Continue with Google
                </Button>
                <Button variant="outline">
                    {" "}
                    <FaGithub role="presentation" /> Continue with Github
                </Button>
            </div>
        </form>
    );
};
