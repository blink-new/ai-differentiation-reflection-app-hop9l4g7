import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Lightbulb, 
  MessageSquare, 
  BookOpen, 
  Bot,
  LogOut
} from 'lucide-react'
import { blink } from '../blink/client'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from './ui/sidebar'

const navigation = [
  { name: 'ダッシュボード', href: '/dashboard', icon: LayoutDashboard },
  { name: '差別化ワークショップ', href: '/workshop', icon: Lightbulb },
  { name: '日々の振り返り', href: '/reflection', icon: MessageSquare },
  { name: 'コンセプトライブラリ', href: '/library', icon: BookOpen },
  { name: 'AI チャット', href: '/chat', icon: Bot },
]

export function AppSidebar() {
  const location = useLocation()

  return (
    <Sidebar>
      <SidebarHeader className="p-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">365号室</h2>
            <p className="text-xs text-muted-foreground">未来への階段</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarMenu>
          {navigation.map((item) => (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton asChild isActive={location.pathname === item.href}>
                <Link to={item.href} className="flex items-center space-x-3">
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => blink.auth.logout()}>
              <LogOut className="w-5 h-5" />
              <span>サインアウト</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}