import { Link } from 'react-router'

export function Header() {
  return (
    <header className='border-b'>
      <nav className='mx-auto flex max-w-5x1 items-center justify-between px-4 py-8'>
        <Link to="/" className='font-semibold'>
          GéoEmploi
        </Link>
        <Link to="/login" className="text-sm hover:underline">
          Connexion
        </Link>
      </nav>
    </header>
  )
}