import QRCode from "./QRcode"
export default function HomePage(props) {

    return (
        <>
            <p className="home-page">Hello {props.data.email}, {props.data.message}</p>
            <QRCode qrUrl={props.data.qrUrl} />
        </>
    )
}