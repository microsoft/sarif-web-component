import {ReportingDescriptor, Result, Run} from 'sarif'

export interface RuleEx extends ReportingDescriptor {
	desc: string
	run: Run
}

export interface IResult {
    rule: string
    ruleObj: RuleEx
    source: string
    level: string
    baselinestate: string
    uri: string
    path: string,
    details: any,
    raw: Result,
    run: Run,
}
