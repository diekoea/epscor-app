type  CardProps =  {
    name: string;
}

function Card (props: CardProps) {
    return (
        <div className='card' style={{'backgroundColor': 'rgb(251, 230, 230)', 'width': '300px', 'height': '150px'}}>
            <div className='card-name'>
                <h4>{props.name}</h4>
            </div>
            <div className='card-img'></div>
            <div className='card-subtext-container'>
                <div className='card-subtext'>
                    <span>Learn more</span>
                    <svg fill="none" viewBox="0 0 14 10">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.4" d="M1 5h12m0 0L9 1m4 4L9 9"/>
                    </svg>
                </div>
            </div>
        </div>
    )
}

export default Card;