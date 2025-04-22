import Header from "../components/Header"
import homepageBg from '../assets/images/homepage-bg.webp'

const HomePage = () => {
    return (
        <div className="flex flex-col w-screen h-screen">
            <Header/>
            <img
                src={homepageBg}
            />
        </div>
    )
}

export default HomePage