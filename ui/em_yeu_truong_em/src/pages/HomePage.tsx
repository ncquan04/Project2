import Header from "../components/Header"
import homepageBg from '../assets/images/homepage-bg.webp'

const HomePage = () => {
    return (
        <div className="flex flex-col">
            <Header/>
            <img
                src={homepageBg}
                className="w-full h-full object-cover"
            />
        </div>
    )
}

export default HomePage