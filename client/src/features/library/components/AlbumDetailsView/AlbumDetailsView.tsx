import * as React from 'react';
import {Actions} from 'definitions/actions';
import {LibraryState, PlayerState, Dict} from 'definitions';
import ScrollableDiv from 'components/ScrollableDiv';
import {TrackList} from '../TrackList';
import {albumURI, Track} from 'compactd-models';
import BetterImage from 'components/BetterImage';
import SuggestionsView from '../SuggestionsView';
import Artwork from 'app/Artwork';
import { Tab2, Tabs2 } from "@blueprintjs/core";

require('./AlbumDetailsView.scss');

interface AlbumDetailsViewProps {
  actions: Actions;
  album: string;
  artist: string;
  library: LibraryState;
  player: PlayerState;
}

export class AlbumDetailsView extends React.Component<AlbumDetailsViewProps, {showHidden: boolean}>{
  getAlbumId (props: AlbumDetailsViewProps = this.props) {
    
    return albumURI({name: props.album, artist: props.artist});
  }
  componentWillUnmount () {
    const id = this.getAlbumId();
    if (this.props.album && id) {
      Artwork.getInstance().decreaseCacheLocks(id, 'large');
    }
  }
  componentWillReceiveProps (nextProps: AlbumDetailsViewProps) {
    if (this.props.album && nextProps.album && this.getAlbumId() !== this.getAlbumId(nextProps)) {
      Artwork.getInstance().decreaseCacheLocks(this.getAlbumId(), 'large');
      Artwork.getInstance().increaseCacheLocks(this.getAlbumId(nextProps), 'large');
    
      this.props.actions.fetchAlbum(this.getAlbumId(nextProps));
    }
  }
  componentDidMount () {
    const id = this.getAlbumId();
    if (this.props.album && id) {
      this.props.actions.fetchAlbum(id);
      Artwork.getInstance().increaseCacheLocks(id, 'large');
    }
  }
  handleClick () {
    const {actions, library, artist, player} = this.props;
    const id = this.getAlbumId();
    const album = library.albumsById[id];
    this.props.actions.replacePlayerStack(album, !this.state.showHidden);
  }
  renderAlbumContent () {
    const {actions, library, artist, player} = this.props;
    const id = this.getAlbumId();
    const album = library.albumsById[id];
    
    const hasMultipleDisc = !!album.tracks.find((val) => {
      return !!val.disc;
    });
    if (hasMultipleDisc) {
      const albumsByDisc = album.tracks.reduce((acc, val) => {
        return {
          ...acc,
          [val.disc]: [].concat(...[acc[val.disc] || []], val)
        }
      }, {} as Dict<Track[]>);
  
      const content = Object.keys(albumsByDisc).map((disc) => {
        const tracks = albumsByDisc[disc];
  
        return <Tab2 id={disc} title={'Disc ' + disc} panel={
          <TrackList
            actions={actions}
            tracks={tracks}
            library={library}
            player={player} />
        }/>
      });
      return <Tabs2 id="discs">{content}</Tabs2>;
    } else {
      return <TrackList
        actions={actions}
        tracks={album.tracks}
        library={library}
        player={player} />;
    }
  }
  render (): JSX.Element {
    const {actions, library, artist, player} = this.props;
    const id = this.getAlbumId();
    const album = library.albumsById[id];
    if (!album) {
      return <SuggestionsView library={library} actions={actions} />;
    }
    const p = albumURI(album._id);
    
    return <div className="album-details-view">
      <div className="album-header">
        <div className="album-image" onClick={this.handleClick.bind(this)}>
          <BetterImage src={Artwork.getInstance().getLargeCover(album._id, 128)} size={128} />
          <span className="dark-overlay"></span>
          <span className="play-overlay pt-icon pt-icon-play"></span>
        </div>  
        <div className="album-infos">
          <div className="album-title">{album.name}</div>
          <div className="album-year">{album.year}</div>
        </div>
      </div>
      <div className="album-content">
        <ScrollableDiv offset={0} binding={album}>
          {this.renderAlbumContent()}
        </ScrollableDiv>
      </div>
    </div>
  }
}
