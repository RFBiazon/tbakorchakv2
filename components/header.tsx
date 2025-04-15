import Image from 'next/image'

export function Header() {
  return (
    <header className="bg-black h-14 fixed top-0 left-0 right-0 z-50">
      <div className="h-full flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Image
            src="/NeoSystemsAI.png"
            alt="NeoSystems Logo"
            width={180}
            height={35}
            className="h-10 w-auto"
            priority
          />
        </div>
        <div className="text-white text-sm">
          <button className="hover:text-gray-300">
            Sair
          </button>
        </div>
      </div>
    </header>
  )
} 