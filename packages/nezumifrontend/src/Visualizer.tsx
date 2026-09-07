export default function Visualizer() {
    return (
        <main className="flex flex-col justify-center h-screen w-screen bg-gray-900 font-comic">
            <img src="/hhgregg.png" alt="hhgregg" className="mx-auto" width="240" height="200" />
            <h2 className="flex justify-center text-amber-400 text-4xl p-1 font-bold">Hassypanel v9™</h2>
            <div className="flex flex-row justify-center items-center gap-4 p-1">
                <a href="/rotta" className="bg-amber-400 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded-full">Råtta</a>
                <a href="/moth" className="bg-amber-400 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded-full">MOTH</a>
            </div>
        </main>
    )
}