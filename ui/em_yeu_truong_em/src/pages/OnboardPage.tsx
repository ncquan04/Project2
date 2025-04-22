import { useNavigate } from "react-router-dom"

const OnboardPage = () => {
    const navigate = useNavigate();

    return (
        <div
            className='w-screen h-screen flex'
            style={{
                backgroundImage: 'url("https://storage.googleapis.com/hust-files/2021-11-15/5807675312963584/background-new-page_.9m.jpeg")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            }}
        >
            <div
                className='flex flex-col w-full h-[30%] pl-[8%] pr-[8%] pt-4'
                style={{
                    background: 'linear-gradient(to bottom, rgba(189, 47, 47, 1) 50%, rgba(189, 47, 47, 0) 100%)',
                }}>
                <div className='flex flex-row justify-between items-center'>
                    <div className='w-[50%] flex flex-row items-center'>
                        <img
                            src='https://storage.googleapis.com/hust-files/2023-11-01/5807675312963584/ggg_3.4k.png'
                            alt="Logo"
                        />
                        <div className='ml-5 flex flex-col  items-start'>
                            <span className='text-white text-xl font-bold'>ĐẠI HỌC BÁCH KHOA HÀ NỘI</span>
                            <span className='text-white text-lg font-medium'>HỆ THỐNG ĐIỂM DANH SINH VIÊN</span>
                        </div>
                    </div>
                    <div
                        className='text-sm font-medium text-white bg-[rgba(0,0,0,0)] border-2 pl-5 pr-5 pt-1 pb-1 border-white hover:cursor-pointer rounded-lg'
                        onClick={() => {
                            navigate('/login')
                        }}
                    >
                        ĐĂNG NHẬP
                    </div>
                </div>
            </div>
        </div>
    )
}

export default OnboardPage