import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/')({
  component: Index,
})

function Index() {
  return (
    <div className="p-2">
      <h3 className='text-3xl font-bold underline'>Welcome Home</h3>
    </div>
  )
}