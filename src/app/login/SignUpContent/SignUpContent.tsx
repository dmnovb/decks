import { useAuth } from "@/providers/auth-provider";
import { ChangeEvent, FormEvent, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FaGoogle, FaGithub } from "react-icons/fa";

export const SignUpContent = () => {
    const { register, isLoading } = useAuth();

    const [data, setData] = useState({
        name: "",
        password: "",
        email: "",
    });

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setData({ ...data, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const { name, password, email } = data;
        await register(name, password, email);
    };

    const isDisabled = isLoading || !data.name || !data.email || !data.password;

    return (
        <div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <Label>Name</Label>
                    <Input
                        onChange={handleChange}
                        value={data.name}
                        name="name"
                        placeholder="Enter your name"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <Label>Email address</Label>
                    <Input
                        onChange={handleChange}
                        value={data.email}
                        name="email"
                        placeholder="Enter your email address"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <Label className="flex justify-between">Password</Label>
                    <Input
                        onChange={handleChange}
                        value={data.password}
                        name="password"
                        type="password"
                        placeholder="Enter your password"
                    />
                </div>

                <Button disabled={isDisabled} type="submit">
                    SIGN UP
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
        </div>
    );
};
