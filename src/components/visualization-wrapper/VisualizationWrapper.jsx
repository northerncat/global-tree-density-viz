import React from 'react';

import GlobeViz from '../visualizations/GlobeViz.jsx';
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Typography from '@material-ui/core/Typography';
import Link from '@material-ui/core/Link';

const useStyles = makeStyles(theme => ({
    topBar: {
        backgroundColor: '#111632',
    },
    title: {
        flexGrow: 1,
        padding: '0.5em 2em 0.5em 2em',
        margin: 'auto',
        fontSize: '16px',
        color: '#ffffff',

    },
    bottomBar: {
        backgroundColor: '#111632',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
}));

const VisualizationWrapper = () => {
    const classes = useStyles();

    return (
        <div>
            <AppBar position='fixed' className={classes.topBar}>
                    <Typography variant='h6' className={classes.title}>
                        Global Tree Density Visualization
                    </Typography>
            </AppBar>
            <GlobeViz style={{ margine: 'auto' }}/>
            <AppBar position='static' className={classes.bottomBar}>
                    <Typography variant="h6" className={classes.title}>
                        Data Source: <Link color='inherit' href='https://elischolar.library.yale.edu/yale_fes_data/1/'>
                            Crowther, T., Glick, H., Covey, K., et al. "Global tree density map" (2015)
                        </Link>
                    </Typography>
            </AppBar>
        </div>
    );
};

export default VisualizationWrapper;
