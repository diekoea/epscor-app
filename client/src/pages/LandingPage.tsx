import { useNavigate } from 'react-router-dom';
import claflin from '../assets/img/claflin.png';
import usc from '../assets/img/usc-logo.svg';
import nsf from '../assets/img/nsf-logo.png';
import researchers from '../assets/img/scientists-lab.png';
import facebook from '../assets/img/facebook.png';
import twitter from '../assets/img/twitter.png';
import instagram from '../assets/img/instagram.png';
import youtube from '../assets/img/youtube.png';

function LandingPage() {
    const navigate = useNavigate();
    return (
        <div className='landing-container'>
            <div className='header'>
                <h1>Tool</h1>
            </div>
            <div className='body'>
                <div>
                    <img src={researchers} alt='' />
                </div>
                <div>
                    <h3>Welcome to Transcriptome Analysis Tool</h3>
                    <p>
                        Unlock the mysteries of gene expression with our innovative transcriptome analysis tool.
                        Our tool empowers researchers and scientists to delve deeper into the intricate world of RNA transcripts, 
                        offering a comprehensive understanding of gene expression patterns and their implications in 
                        various biological phenomena.
                    </p>
                    <br />
                    <h3>Why this Tool?</h3>
                    <p>
                        Our tool goes beyond traditional differential gene analysis methods by introducing the concept of Pearson composite.
                        This novel metric quantifies the extent of change in expression profile for every RNA transcript in your dataset, 
                        providing a holistic view of transcriptomic alterations associated with specific conditions.
                    </p>
                    <br />
                    <h3>Using the Tool</h3>
                    <p>
                        To begin, simply upload your CSV file containing RNA sequencing data, and our system will 
                        take care of the data processing and analysis for you. Once the analysis is complete, the results are
                        downloaded to your device. You can conduct further analysis offline or share the processed data with colleagues.
                    </p>
                    <br />
                    <button onClick={() => navigate('upload-data')}>Get Started</button>
                </div>
            </div>

        

            <div className='footer'>
                <h3>Brought to you by</h3>
                <div className='affiliated-institutions'>
                    <img src={nsf} alt='' />
                    <img src={claflin} alt='' />
                    <img src={usc} alt='' />
                </div>

                <div className='contact'>
                    <div className='address'>
                        <h3>Contact Us</h3>
                        <p>400 Magnolia Street</p>
                        <p>Orangeburg, SC 29115</p>
                        <p>(803) 535 5018</p>
                    </div>
                    <div className='social-media'>
                        <div>
                        <h3>Stay Connected</h3>
                        </div>
                        <div className="icons">
                            {/* Facebook */}
                            <a href='https://www.facebook.com/ClaflinUniversity1869/' target="_blank" rel='noreferrer'>  
                                <img src={facebook} alt='' />
                            </a>

                            {/* Instagram */}
                            <a href="https://www.instagram.com/claflin1869/" target="_blank" rel='noreferrer'>
                                <img src={instagram} alt='' />
                            </a>

                            {/* Twitter */}
                            <a href="https://twitter.com/ClaflinUniv1869" target="_blank" rel='noreferrer'>
                                <img src={twitter} alt='' />
                            </a>

                            {/* YouTube */}
                            <a href="https://www.youtube.com/channel/UCor6ta45JRtt1z1A5jZTjVQ" target="_blank" rel='noreferrer'>
                                <img src={youtube} alt='' />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LandingPage;