import React from "react";

import { ChevronsUpDown } from "lucide-react";
import { SidebarMenuButton, SidebarMenuItem } from "../ui/sidebar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useAuth } from "@/providers/auth-provider";
import { truncate } from 'lodash'

export function SidebarFooter() {
  const { user, logout } = useAuth()

  return (
    <SidebarMenuItem className="list-none">
      <DropdownMenu>
        <DropdownMenuTrigger
          className="hover:cursor-pointer p-1 h-full"
          asChild
        >
          <SidebarMenuButton className="flex justify-between">
            <div className="flex items-center gap-2">
              <Avatar>
                {/* <AvatarImage src="https://cdn.discordapp.com/avatars/307881481823584256/f351ac0737ad1132f97c960d089af7c9.webp?size=80" /> */}
                <AvatarFallback className="bg-gradient-to-br from-green-200 to-green-900 font-extrabold text-black">
                  {user!.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-col">
                <p>{user!.name}</p>
                <p className="text-xs text-muted">{truncate(user!.email, { length: 23 })}</p>
              </div>
            </div>

            <ChevronsUpDown />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="top"
          className="w-[--radix-popper-anchor-width] bg-background-1"
        >
          <DropdownMenuItem>
            <span>Account</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <span>Billing</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={logout}>
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
};