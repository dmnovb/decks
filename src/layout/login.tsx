'use client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/providers/auth-provider"
import { Layers } from "lucide-react"
import { useRouter } from "next/navigation"
import { ChangeEvent, FormEvent, useState } from "react"
import { FaGoogle, FaGithub } from "react-icons/fa";

export function Login() {
    return (
        <div className="flex flex-row min-h-screen justify-center items-center">
            <div className="shadow-md p-4 bg-background-1 rounded-sm border-divider-0 border">
                <div className="flex justify-center pb-8 items-center gap-2">
                    <Layers className="text-[var(--primary)]" />
                    <span className="text-xl font-extrabold select-none">DECKS</span>
                </div>
                <Tabs defaultValue="account" className="flex flex-col gap-8">
                    <TabsList className="w-[350px] bg-background-2">
                        <TabsTrigger className="" value="account">Log in</TabsTrigger>
                        <TabsTrigger value="password">Sign up</TabsTrigger>
                    </TabsList>

                    <TabsContent value="account">
                        <LoginContent />
                    </TabsContent>

                    <TabsContent value="password">
                        <SignUpContent />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}

const LoginContent = () => {
    const { login, isLoading } = useAuth()

    const router = useRouter()

    const [data, setData] = useState({
        email: '',
        password: ''
    })

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setData({ ...data, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        await login(data.email, data.password)
        router.push('/')
    }

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
                    <Button variant="link" className="p-0 w-fit text-xs">Forgot password?</Button>
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
                <Button variant="outline"> <FaGoogle /> Continue with Google</Button>
                <Button variant="outline"> <FaGithub role="presentation" /> Continue with Github</Button>
            </div>
        </form>
    )
}

const SignUpContent = () => {
    const { register } = useAuth()

    const router = useRouter()

    const [data, setData] = useState({
        name: '',
        password: '',
        email: ''
    })

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setData({ ...data, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const { name, password, email } = data
        await register(name, password, email)
        router.push('/')
    }

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
                    <Label className="flex justify-between">
                        Password
                    </Label>
                    <Input
                        onChange={handleChange}
                        value={data.password}
                        name="password"
                        type="password"
                        placeholder="Enter your password"
                    />
                </div>

                <Button type="submit">
                    SIGN UP
                </Button>

                <div className="flex w-full items-center text-xs">
                    <div className="flex-grow border-t border-divider-1"></div>
                    <span className="px-3 text-gray-400">OR</span>
                    <div className="flex-grow border-t border-divider-1"></div>
                </div>

                <div className="flex flex-col gap-2">
                    <Button variant="outline"> <FaGoogle /> Continue with Google</Button>
                    <Button variant="outline"> <FaGithub role="presentation" /> Continue with Github</Button>
                </div>
            </form>
        </div>
    )
}