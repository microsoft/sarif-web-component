import { shallow } from 'enzyme'
import * as Enzyme from 'enzyme'
import * as Adapter from 'enzyme-adapter-react-16'
import { renderPathCell } from './RunCard.renderPathCell'
import { demoResults } from './PathCellDemo'

Enzyme.configure({ adapter: new Adapter() })

function log(element: JSX.Element) {
	console.log(
		shallow(element)
			.debug({ ignoreProps: false, verbose: false })
			.replace('[undefined]', '')
	)
}

// WIP: Testing various inputs.
test('renderPathCell', () => {
	for (const result of demoResults()) {
		log(renderPathCell(result))
	}
})
