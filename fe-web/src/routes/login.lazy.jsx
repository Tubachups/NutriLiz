import { createLazyFileRoute } from '@tanstack/react-router'
import LoginComponent from '../components/Login/LoginComponent'

export const Route = createLazyFileRoute('/login')({
  component: LoginComponent,
})