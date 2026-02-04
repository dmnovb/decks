'use client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/providers/auth-provider"
import { Layers } from "lucide-react"
import { ChangeEvent, FormEvent, useState } from "react"
import { FaGoogle, FaGithub } from "react-icons/fa";

const Login = () => {
    return (
        <div className="flex flex-row min-h-screen justify-center items-center z-50">
            <Noise />

            <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden blur-3xl">
                {/* Shape 1 */}
                <div
                    style={{
                        clipPath:
                            "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
                        boxShadow:
                            "0 0 30px 8px oklch(64.09% 0.105 183.78) inset, 0 0 60px 20px oklch(64.09% 0.105 183.78)",
                    }}
                    className="absolute right-[-50%] top-[-20rem] aspect-[1155/678] w-[36rem] rotate-[95deg] bg-gradient-to-tr from-[oklch(64.09%_0.105_183.78)] to-[oklch(10%_0.105_183.78)] opacity-40 sm:w-[72rem]"
                />

                {/* Shape 2 */}
                <div
                    style={{
                        clipPath:
                            "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)",
                        boxShadow:
                            "0 0 25px 6px oklch(64.09% 0.105 183.78) inset, 0 0 50px 15px oklch(64.09% 0.105 183.78)",
                    }}
                    className="absolute right-[calc(50%-25rem)] top-[10rem] aspect-[1155/678] w-[28rem] -translate-x-1/2 rotate-[40deg] bg-gradient-to-tr from-[oklch(64.09%_0.105_183.78)] to-[oklch(15%_0.08_183.78)] opacity-30 sm:w-[60rem]"
                />

                {/* Shape 3 */}
                <div
                    style={{
                        clipPath:
                            "polygon(30% 10%, 80% 20%, 100% 70%, 60% 90%, 10% 70%, 0 30%)",
                        boxShadow:
                            "0 0 20px 5px oklch(64.09% 0.105 183.78) inset, 0 0 45px 12px oklch(64.09% 0.105 183.78)",
                    }}
                    className="absolute left-[10%] bottom-[-15rem] aspect-[1155/678] w-[32rem] rotate-[15deg] bg-gradient-to-tr from-[oklch(64.09%_0.105_183.78)] to-[oklch(45%_0.12_183.78)] opacity-25 sm:w-[64rem]"
                />
            </div>


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

export default Login

const LoginContent = () => {
    const { login, isLoading } = useAuth()

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
    const { register, isLoading } = useAuth()

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

                <Button disabled={isLoading} type="submit">
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

const Noise = () => (
    <svg
        className="fixed inset-0 w-full h-full z-[-1]"
        viewBox="0 0 1920 1080"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
    >
        <defs>
            <filter id="noise" x="0%" y="0%" width="100%" height="100%">
                <feTurbulence
                    baseFrequency="0.9"
                    numOctaves="1"
                    result="noise"
                    seed="2"
                    type="fractalNoise"
                />
                <feColorMatrix in="noise" type="saturate" values="0" />
                <feComponentTransfer>
                    <feFuncA
                        type="discrete"
                        tableValues="0 .5 0 .5 0 .5 0 .5 0 .5 0 .5 0 .5 0 .5 0 .5 0 .5"
                    />
                </feComponentTransfer>
                <feComposite operator="over" in2="SourceGraphic" />
            </filter>

            <filter id="animatedNoise">
                <feTurbulence
                    baseFrequency="0.85"
                    numOctaves="2"
                    result="noise"
                    seed="5"
                    type="turbulence"
                >
                    <animate
                        attributeName="seed"
                        values="1;5;10;15;20;25;30;1"
                        dur="0.1s"
                        repeatCount="indefinite"
                    />
                </feTurbulence>
                <feColorMatrix in="noise" type="saturate" values="0" />
                <feComponentTransfer>
                    <feFuncA
                        type="discrete"
                        tableValues="0 .3 0 .3 0 .3 0 .3 0 .3 0 .3"
                    />
                </feComponentTransfer>
            </filter>
        </defs>

        <rect width="100%" height="100%" fill="transparent" filter="url(#noise)" opacity="0.08" />
        <rect width="100%" height="100%" fill="white" filter="url(#animatedNoise)" opacity="0.08" />
        <rect width="100%" height="100%" fill="black" opacity="0.015">
            <animate
                attributeName="opacity"
                values="0.01;0.02;0.015;0.025;0.01"
                dur="2s"
                repeatCount="indefinite"
            />
        </rect>
    </svg>
)
